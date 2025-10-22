import * as functions from "firebase-functions/v1";
export declare const joinEvent: functions.HttpsFunction & functions.Runnable<any>;
export declare const leaveEvent: functions.HttpsFunction & functions.Runnable<any>;
/**
 * 李멸???媛먯냼(leave) 吏곹썑 鍮덉옄由ш? ?앷린硫? 媛???ㅻ옒 湲곕떎由??湲곗뿴 1紐낆쓣 ?먮룞 ?밴꺽
 */
export declare const onAttendeeWrite: functions.CloudFunction<functions.Change<functions.firestore.DocumentSnapshot>>;
//# sourceMappingURL=join_leave.d.ts.map
