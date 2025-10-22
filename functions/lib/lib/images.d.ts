/**
 * ?대?吏 泥섎━ ?좏떥由ы떚
 * EXIF ?쒓굅, ?몃꽕???앹꽦, ?댁떆 怨꾩궛
 */
interface ImageProcessingResult {
    hash: string;
    originalSize: number;
    processedSize: number;
    thumbnailSize: number;
    smallSize: number;
}
/**
 * ?대?吏 泥섎━ 硫붿씤 ?⑥닔
 */
export declare function processImage(gcsPath: string): Promise<ImageProcessingResult>;
/**
 * ?대?吏 ?낅줈???몃━嫄곕뒗 index.ts濡??대룞?? */
/**
 * 以묐났 ?대?吏 寃?? */
export declare function checkDuplicateImage(hash: string): Promise<{
    isDuplicate: boolean;
    existingPath?: string;
}>;
/**
 * ?대?吏 ??젣 (?먮낯, ?몃꽕?? ?묒? 踰꾩쟾 紐⑤몢)
 */
export declare function deleteImageVariants(gcsPath: string): Promise<void>;
export {};
//# sourceMappingURL=images.d.ts.map
