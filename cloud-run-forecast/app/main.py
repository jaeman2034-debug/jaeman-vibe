"""
🚀 야고 비서 AI 예측 시스템 - Cloud Run API
FastAPI + statsmodels 기반 시계열 예측 서비스
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import numpy as np
import logging
from datetime import datetime, timedelta
import json

# 시계열 예측 라이브러리
try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    from statsmodels.tsa.seasonal import seasonal_decompose
    from statsmodels.tsa.stattools import adfuller
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False
    logging.warning("statsmodels not available, using fallback methods")

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Yago Assistant Forecast API",
    description="AI-powered activity prediction for sports and market data",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic 모델들
class CellSeries(BaseModel):
    """개별 그리드 셀의 시계열 데이터"""
    cell: str = Field(..., description="그리드 셀 키 (lat_lng 형식)")
    lat: float = Field(..., description="위도", ge=-90, le=90)
    lng: float = Field(..., description="경도", ge=-180, le=180)
    series: List[int] = Field(..., description="과거 일자별 활동량 데이터", min_items=1)
    metadata: Optional[Dict] = Field(None, description="추가 메타데이터")

class ForecastRequest(BaseModel):
    """예측 요청 모델"""
    horizon: int = Field(1, description="예측 기간 (일 단위)", ge=1, le=7)
    cells: List[CellSeries] = Field(..., description="예측할 셀 목록", min_items=1)
    model_type: str = Field("auto", description="예측 모델 타입", regex="^(auto|exponential|simple|trend)$")
    confidence_level: float = Field(0.8, description="신뢰도 수준", ge=0.5, le=0.99)
    include_seasonality: bool = Field(True, description="계절성 포함 여부")

class ForecastResult(BaseModel):
    """개별 셀 예측 결과"""
    cell: str
    lat: float
    lng: float
    yhat: float = Field(..., description="예측값")
    yhat_lower: float = Field(..., description="신뢰구간 하한")
    yhat_upper: float = Field(..., description="신뢰구간 상한")
    confidence: float = Field(..., description="신뢰도")
    model_used: str = Field(..., description="사용된 모델")
    data_quality: str = Field(..., description="데이터 품질 (good/fair/poor)")
    trend: str = Field(..., description="트렌드 (increasing/decreasing/stable)")

class ForecastResponse(BaseModel):
    """예측 응답 모델"""
    forecasts: List[ForecastResult]
    summary: Dict
    execution_time: float
    timestamp: datetime

# 유틸리티 함수들
def preprocess_series(series: List[int], min_length: int = 7) -> np.ndarray:
    """시계열 데이터 전처리"""
    y = np.array(series, dtype=float)
    
    # 결측값 처리 (0으로 대체)
    y = np.where(y < 0, 0, y)
    
    # 이상치 제거 (IQR 방법)
    if len(y) > 10:
        Q1 = np.percentile(y, 25)
        Q3 = np.percentile(y, 75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        y = np.where((y < lower_bound) | (y > upper_bound), np.median(y), y)
    
    return y

def detect_trend(series: np.ndarray) -> str:
    """트렌드 감지"""
    if len(series) < 3:
        return "stable"
    
    # 단순 선형 회귀로 트렌드 계산
    x = np.arange(len(series))
    slope = np.polyfit(x, series, 1)[0]
    
    if slope > 0.1:
        return "increasing"
    elif slope < -0.1:
        return "decreasing"
    else:
        return "stable"

def assess_data_quality(series: np.ndarray) -> str:
    """데이터 품질 평가"""
    if len(series) < 7:
        return "poor"
    
    non_zero_count = np.sum(series > 0)
    coverage = non_zero_count / len(series)
    
    if coverage >= 0.7 and len(series) >= 14:
        return "good"
    elif coverage >= 0.5 and len(series) >= 7:
        return "fair"
    else:
        return "poor"

def simple_forecast(series: np.ndarray, horizon: int) -> Dict:
    """단순 예측 (statsmodels 없을 때)"""
    if len(series) == 0:
        return {"yhat": 0, "yhat_lower": 0, "yhat_upper": 0, "model": "zero"}
    
    # 이동평균 기반 예측
    window_size = min(7, len(series))
    recent_avg = np.mean(series[-window_size:])
    
    # 트렌드 계산
    if len(series) >= 2:
        trend = np.mean(np.diff(series[-min(7, len(series)):]))
    else:
        trend = 0
    
    yhat = max(0, recent_avg + trend * horizon)
    
    # 단순 신뢰구간 (평균의 20% 범위)
    std_dev = np.std(series[-window_size:]) if len(series) > 1 else recent_avg * 0.2
    margin = max(std_dev, recent_avg * 0.2)
    
    return {
        "yhat": yhat,
        "yhat_lower": max(0, yhat - margin),
        "yhat_upper": yhat + margin,
        "model": "simple_moving_average"
    }

def exponential_smoothing_forecast(series: np.ndarray, horizon: int, confidence_level: float = 0.8) -> Dict:
    """Exponential Smoothing 예측"""
    if not STATSMODELS_AVAILABLE or len(series) < 7:
        return simple_forecast(series, horizon)
    
    try:
        # 시계열 분해로 계절성 확인
        if len(series) >= 14:
            try:
                decomposition = seasonal_decompose(series, model='additive', period=7)
                seasonal_std = np.std(decomposition.seasonal)
                has_seasonality = seasonal_std > np.std(series) * 0.1
            except:
                has_seasonality = False
        else:
            has_seasonality = False
        
        # 정상성 검정
        try:
            adf_result = adfuller(series)
            is_stationary = adf_result[1] < 0.05
        except:
            is_stationary = False
        
        # 모델 선택
        if has_seasonality and len(series) >= 14:
            # 계절성 있는 데이터
            model = ExponentialSmoothing(
                series, 
                trend='add', 
                seasonal='add', 
                seasonal_periods=7
            )
        elif not is_stationary:
            # 트렌드 있는 데이터
            model = ExponentialSmoothing(series, trend='add', seasonal=None)
        else:
            # 단순 데이터
            model = ExponentialSmoothing(series, trend=None, seasonal=None)
        
        # 모델 피팅
        fit = model.fit(optimized=True, use_brute=True)
        
        # 예측
        forecast = fit.forecast(horizon)
        yhat = float(forecast[-1])
        
        # 신뢰구간 계산 (단순화)
        residuals = series - fit.fittedvalues
        residual_std = np.std(residuals)
        
        # t-분포 기반 신뢰구간 (근사)
        if confidence_level == 0.8:
            t_multiplier = 1.28
        elif confidence_level == 0.9:
            t_multiplier = 1.64
        elif confidence_level == 0.95:
            t_multiplier = 1.96
        else:
            t_multiplier = 1.64
        
        margin = t_multiplier * residual_std
        yhat_lower = max(0, yhat - margin)
        yhat_upper = yhat + margin
        
        return {
            "yhat": yhat,
            "yhat_lower": yhat_lower,
            "yhat_upper": yhat_upper,
            "model": f"exponential_smoothing_{'seasonal' if has_seasonality else 'trend' if not is_stationary else 'simple'}"
        }
        
    except Exception as e:
        logger.warning(f"Exponential smoothing failed: {e}, falling back to simple forecast")
        return simple_forecast(series, horizon)

def forecast_cell(cell_data: CellSeries, horizon: int, model_type: str, confidence_level: float) -> ForecastResult:
    """개별 셀 예측"""
    start_time = datetime.now()
    
    # 데이터 전처리
    series = preprocess_series(cell_data.series)
    
    # 데이터 품질 평가
    data_quality = assess_data_quality(series)
    trend = detect_trend(series)
    
    # 예측 실행
    if model_type == "auto":
        if data_quality == "good" and len(series) >= 14:
            forecast_result = exponential_smoothing_forecast(series, horizon, confidence_level)
        else:
            forecast_result = simple_forecast(series, horizon)
    elif model_type == "exponential":
        forecast_result = exponential_smoothing_forecast(series, horizon, confidence_level)
    else:
        forecast_result = simple_forecast(series, horizon)
    
    execution_time = (datetime.now() - start_time).total_seconds()
    
    return ForecastResult(
        cell=cell_data.cell,
        lat=cell_data.lat,
        lng=cell_data.lng,
        yhat=round(forecast_result["yhat"], 1),
        yhat_lower=round(forecast_result["yhat_lower"], 1),
        yhat_upper=round(forecast_result["yhat_upper"], 1),
        confidence=confidence_level,
        model_used=forecast_result["model"],
        data_quality=data_quality,
        trend=trend
    )

# API 엔드포인트들
@app.get("/")
async def root():
    """헬스 체크"""
    return {
        "service": "Yago Assistant Forecast API",
        "version": "1.0.0",
        "status": "healthy",
        "statsmodels_available": STATSMODELS_AVAILABLE,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """상세 헬스 체크"""
    return {
        "status": "healthy",
        "dependencies": {
            "statsmodels": STATSMODELS_AVAILABLE,
            "numpy": True,
            "fastapi": True
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/forecast", response_model=ForecastResponse)
async def forecast(request: ForecastRequest):
    """메인 예측 API"""
    start_time = datetime.now()
    
    if not request.cells:
        raise HTTPException(status_code=400, detail="No cells provided for forecasting")
    
    logger.info(f"Forecasting {len(request.cells)} cells for {request.horizon} days ahead")
    
    forecasts = []
    success_count = 0
    error_count = 0
    
    for cell_data in request.cells:
        try:
            if len(cell_data.series) < 1:
                raise ValueError("Insufficient data")
            
            result = forecast_cell(cell_data, request.horizon, request.model_type, request.confidence_level)
            forecasts.append(result)
            success_count += 1
            
        except Exception as e:
            logger.error(f"Forecast failed for cell {cell_data.cell}: {e}")
            error_count += 1
            
            # 실패한 셀에 대한 기본값 반환
            forecasts.append(ForecastResult(
                cell=cell_data.cell,
                lat=cell_data.lat,
                lng=cell_data.lng,
                yhat=0.0,
                yhat_lower=0.0,
                yhat_upper=0.0,
                confidence=0.0,
                model_used="error",
                data_quality="poor",
                trend="stable"
            ))
    
    execution_time = (datetime.now() - start_time).total_seconds()
    
    # 요약 통계
    summary = {
        "total_cells": len(request.cells),
        "successful_forecasts": success_count,
        "failed_forecasts": error_count,
        "success_rate": success_count / len(request.cells) if request.cells else 0,
        "average_prediction": np.mean([f.yhat for f in forecasts]) if forecasts else 0,
        "max_prediction": max([f.yhat for f in forecasts]) if forecasts else 0,
        "model_distribution": {}
    }
    
    # 모델 사용 분포
    for forecast in forecasts:
        model = forecast.model_used
        summary["model_distribution"][model] = summary["model_distribution"].get(model, 0) + 1
    
    return ForecastResponse(
        forecasts=forecasts,
        summary=summary,
        execution_time=execution_time,
        timestamp=datetime.now()
    )

@app.post("/forecast/batch")
async def forecast_batch(requests: List[ForecastRequest]):
    """배치 예측 API (여러 날짜 한번에)"""
    results = []
    
    for i, request in enumerate(requests):
        try:
            result = await forecast(request)
            results.append({
                "batch_index": i,
                "status": "success",
                "result": result
            })
        except Exception as e:
            results.append({
                "batch_index": i,
                "status": "error",
                "error": str(e)
            })
    
    return {
        "total_batches": len(requests),
        "successful_batches": len([r for r in results if r["status"] == "success"]),
        "results": results
    }

@app.get("/forecast/models")
async def get_available_models():
    """사용 가능한 예측 모델 목록"""
    models = {
        "auto": {
            "name": "자동 선택",
            "description": "데이터 품질과 길이에 따라 최적 모델 자동 선택",
            "min_data_length": 1,
            "recommended_for": "일반적인 사용"
        },
        "simple": {
            "name": "단순 이동평균",
            "description": "최근 데이터의 이동평균 기반 예측",
            "min_data_length": 1,
            "recommended_for": "데이터가 적거나 단순한 패턴"
        },
        "exponential": {
            "name": "지수 평활법",
            "description": "최근 데이터에 더 큰 가중치를 주는 예측",
            "min_data_length": 7,
            "recommended_for": "트렌드가 있는 데이터"
        },
        "trend": {
            "name": "트렌드 분석",
            "description": "선형 트렌드 기반 예측",
            "min_data_length": 3,
            "recommended_for": "명확한 증가/감소 트렌드"
        }
    }
    
    return {
        "available_models": models,
        "statsmodels_available": STATSMODELS_AVAILABLE,
        "recommendations": {
            "good_data": "exponential",
            "limited_data": "simple",
            "trend_data": "trend",
            "unknown_pattern": "auto"
        }
    }

@app.post("/forecast/evaluate")
async def evaluate_forecast_accuracy(request: ForecastRequest):
    """예측 정확도 평가 (백테스팅)"""
    # 실제 데이터가 있을 때만 사용 가능
    # 여기서는 간단한 시뮬레이션만 제공
    
    if len(request.cells) == 0:
        raise HTTPException(status_code=400, detail="No cells provided")
    
    # 마지막 데이터 포인트를 "실제값"으로 사용하여 정확도 계산
    accuracy_scores = []
    
    for cell_data in request.cells:
        if len(cell_data.series) < 2:
            continue
            
        actual = cell_data.series[-1]  # 마지막 값
        historical = cell_data.series[:-1]  # 나머지 값들로 예측
        
        # 과거 데이터로 예측
        temp_cell = CellSeries(
            cell=cell_data.cell,
            lat=cell_data.lat,
            lng=cell_data.lng,
            series=historical
        )
        
        try:
            forecast_result = forecast_cell(temp_cell, 1, request.model_type, request.confidence_level)
            predicted = forecast_result.yhat
            
            # 정확도 계산 (MAPE)
            if actual > 0:
                mape = abs(predicted - actual) / actual
                accuracy_scores.append(1 - mape)  # 1 - MAPE = 정확도
            
        except Exception:
            continue
    
    if not accuracy_scores:
        return {"error": "Insufficient data for evaluation"}
    
    return {
        "average_accuracy": np.mean(accuracy_scores),
        "median_accuracy": np.median(accuracy_scores),
        "min_accuracy": np.min(accuracy_scores),
        "max_accuracy": np.max(accuracy_scores),
        "evaluated_cells": len(accuracy_scores),
        "total_cells": len(request.cells)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
