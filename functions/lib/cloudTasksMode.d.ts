interface QueueJob {
    type: 'webhook_retry' | 'slack_update' | 'approval_expiry' | 'metrics_update';
    payload: any;
    attempts?: number;
    maxAttempts?: number;
    delaySeconds?: number;
}
export declare function enqueueCloudTask(job: QueueJob): Promise<void>;
export declare const cloudTasksWorker: any;
export declare function enableCloudTasksMode(): void;
export {};
//# sourceMappingURL=cloudTasksMode.d.ts.map
