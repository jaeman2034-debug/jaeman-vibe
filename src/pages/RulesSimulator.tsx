import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, Eye, Users, MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react';

interface SimulationData {
  type: string;
  priority: string;
  rules: {
    required: number;
    ttlMinutes: number;
    stages: any[];
    approverAllowlist: string[] | null;
    maxResubmits: number;
    resubmitCooldownMinutes: number;
  };
  testScenario: {
    title: string;
    summary: string;
    type: string;
    refId: string;
    approvers: Array<{
      stage: number;
      name: string;
      required: number;
      approvers: string[];
      dmTargets: string[];
    }>;
  };
  preview: {
    slackMessage: any[];
    dmMessages: Array<{
      stage: number;
      name: string;
      message: string;
      targets: string[];
    }>;
  };
}

export default function RulesSimulator() {
  const [loading, setLoading] = useState(false);
  const [simulation, setSimulation] = useState<SimulationData | null>(null);
  const [testData, setTestData] = useState({
    title: '테스트 승인 요청',
    summary: '시뮬레이션용 승인 요청입니다',
    refId: `test-${Date.now()}`
  });
  const [selectedType, setSelectedType] = useState('default');
  const [selectedPriority, setSelectedPriority] = useState('normal');
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<any>(null);

  const types = ['default', 'market', 'meetup', 'application', 'urgent'];
  const priorities = ['low', 'normal', 'high', 'critical'];

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/slack/admin/rules/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': import.meta.env.VITE_INTERNAL_KEY,
        },
        body: JSON.stringify({
          type: selectedType,
          priority: selectedPriority,
          testData
        })
      });

      const data = await response.json();
      if (data.ok) {
        setSimulation(data.simulation);
        setResult(null);
      } else {
        setResult({ error: data.error });
      }
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/slack/admin/rules/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': import.meta.env.VITE_INTERNAL_KEY,
        },
        body: JSON.stringify({
          type: selectedType,
          priority: selectedPriority,
          testData,
          dryRun
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const renderSlackMessage = (blocks: any[]) => {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="text-sm text-gray-600 mb-2">Slack 메시지 미리보기</div>
        {blocks.map((block, index) => {
          if (block.type === 'header') {
            return (
              <div key={index} className="text-lg font-bold mb-2">
                {block.text.text}
              </div>
            );
          }
          if (block.type === 'section') {
            return (
              <div key={index} className="mb-3">
                {block.text && (
                  <div className="text-sm" dangerouslySetInnerHTML={{ 
                    __html: block.text.text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                  }} />
                )}
                {block.fields && (
                  <div className="mt-2 space-y-1">
                    {block.fields.map((field: any, fieldIndex: number) => (
                      <div key={fieldIndex} className="text-xs text-gray-600">
                        <strong>{field.title}:</strong> {field.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          if (block.type === 'actions') {
            return (
              <div key={index} className="flex gap-2 mt-3">
                {block.elements.map((element: any, elementIndex: number) => (
                  <button
                    key={elementIndex}
                    className={`px-3 py-1 rounded text-sm ${
                      element.style === 'primary' 
                        ? 'bg-blue-500 text-white' 
                        : element.style === 'danger'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {element.text.text}
                  </button>
                ))}
              </div>
            );
          }
          if (block.type === 'context') {
            return (
              <div key={index} className="text-xs text-gray-500 mt-2">
                {block.elements.map((element: any, elementIndex: number) => (
                  <div key={elementIndex} dangerouslySetInnerHTML={{ 
                    __html: element.text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
                  }} />
                ))}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">규칙 시뮬레이터</h1>
        <Badge variant="outline">승인 워크플로우 테스트</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 설정 패널 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              시뮬레이션 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">타입</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">우선순위</Label>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={testData.title}
                onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="승인 요청 제목"
              />
            </div>

            <div>
              <Label htmlFor="summary">요약</Label>
              <Textarea
                id="summary"
                value={testData.summary}
                onChange={(e) => setTestData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="승인 요청 요약"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="refId">참조 ID</Label>
              <Input
                id="refId"
                value={testData.refId}
                onChange={(e) => setTestData(prev => ({ ...prev, refId: e.target.value }))}
                placeholder="참조 ID"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dryRun"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
              />
              <Label htmlFor="dryRun">드라이런 모드 (실제 전송 없이 시뮬레이션만)</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={runSimulation} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                시뮬레이션 실행
              </Button>
              <Button onClick={runTest} disabled={loading} variant="outline">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                테스트 실행
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 결과 패널 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              시뮬레이션 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result && (
              <Alert className={result.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                <AlertDescription>
                  {result.error ? (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      {result.error}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {result.message}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {simulation && (
              <Tabs defaultValue="rules" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="rules">규칙</TabsTrigger>
                  <TabsTrigger value="preview">미리보기</TabsTrigger>
                  <TabsTrigger value="scenario">시나리오</TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>필요 승인 수</Label>
                      <div className="text-2xl font-bold">{simulation.rules.required}</div>
                    </div>
                    <div>
                      <Label>TTL (분)</Label>
                      <div className="text-2xl font-bold">{simulation.rules.ttlMinutes}</div>
                    </div>
                    <div>
                      <Label>최대 재상신</Label>
                      <div className="text-2xl font-bold">{simulation.rules.maxResubmits}</div>
                    </div>
                    <div>
                      <Label>재상신 쿨다운 (분)</Label>
                      <div className="text-2xl font-bold">{simulation.rules.resubmitCooldownMinutes}</div>
                    </div>
                  </div>

                  {simulation.rules.stages.length > 0 && (
                    <div>
                      <Label>승인 단계</Label>
                      <div className="space-y-2 mt-2">
                        {simulation.rules.stages.map((stage: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="font-medium">단계 {index + 1}: {stage.name}</div>
                            <div className="text-sm text-gray-600">
                              필요 승인: {stage.required}명
                            </div>
                            {stage.approvers && stage.approvers.length > 0 && (
                              <div className="text-sm text-gray-600">
                                승인자: {stage.approvers.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {simulation.rules.approverAllowlist && (
                    <div>
                      <Label>승인자 허용 목록</Label>
                      <div className="text-sm text-gray-600 mt-1">
                        {simulation.rules.approverAllowlist.join(', ')}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4" />
                      Slack 메시지
                    </Label>
                    {renderSlackMessage(simulation.preview.slackMessage)}
                  </div>

                  {simulation.preview.dmMessages.length > 0 && (
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4" />
                        DM 메시지
                      </Label>
                      <div className="space-y-2">
                        {simulation.preview.dmMessages.map((dm, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="font-medium">단계 {dm.stage}: {dm.name}</div>
                            <div className="text-sm text-gray-600 mt-1">{dm.message}</div>
                            {dm.targets.length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                대상: {dm.targets.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="scenario" className="space-y-4">
                  <div>
                    <Label>테스트 시나리오</Label>
                    <div className="p-3 border rounded-lg mt-2">
                      <div className="font-medium">{simulation.testScenario.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{simulation.testScenario.summary}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        타입: {simulation.testScenario.type} | ID: {simulation.testScenario.refId}
                      </div>
                    </div>
                  </div>

                  {simulation.testScenario.approvers.length > 0 && (
                    <div>
                      <Label>승인자 시나리오</Label>
                      <div className="space-y-2 mt-2">
                        {simulation.testScenario.approvers.map((approver, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="font-medium">단계 {approver.stage}: {approver.name}</div>
                            <div className="text-sm text-gray-600">
                              필요 승인: {approver.required}명
                            </div>
                            {approver.approvers.length > 0 && (
                              <div className="text-sm text-gray-600">
                                승인자: {approver.approvers.join(', ')}
                              </div>
                            )}
                            {approver.dmTargets.length > 0 && (
                              <div className="text-sm text-gray-600">
                                DM 대상: {approver.dmTargets.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
