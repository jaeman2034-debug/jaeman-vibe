import { Role, ActionKey, TAB_ACTIONS, ROLE_ACTIONS } from "@/constants/roles";

function Btn({disabled, children, ...p}:{disabled?:boolean; children:React.ReactNode; onClick?:()=>void}) {
  return (
    <button
      {...p}
      disabled={disabled}
      className={
        "btn " +
        (disabled ? "opacity-50 cursor-not-allowed" : "")
      }
    >
      {children}
    </button>
  );
}

export default function ActionBar({
  currentTab, role, onCreate, onApply, onJoin, onBook, onManage,
}: {
  currentTab: keyof typeof TAB_ACTIONS;
  role: Role;
  onCreate?: () => void;
  onApply?: () => void;
  onJoin?: () => void;
  onBook?: () => void;
  onManage?: () => void;
}) {
  const actions = TAB_ACTIONS[currentTab] as ActionKey[];
  const allowed = (a: ActionKey) => ROLE_ACTIONS[role]?.includes(a);
  const show = (a: ActionKey) => actions.includes(a);

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {show("create_product") && <Btn disabled={!allowed("create_product")} onClick={onCreate}>상품 등록</Btn>}
      {show("create_club")    && <Btn disabled={!allowed("create_club")}    onClick={onCreate}>클럽 개설</Btn>}
      {show("join_club")      && <Btn disabled={!allowed("join_club")}      onClick={onJoin}>클럽 참여</Btn>}
      {show("post_job")       && <Btn disabled={!allowed("post_job")}       onClick={onCreate}>채용 공고 등록</Btn>}
      {show("apply_job")      && <Btn disabled={!allowed("apply_job")}      onClick={onApply}>지원하기</Btn>}
      {show("create_event")   && <Btn disabled={!allowed("create_event")}   onClick={onCreate}>이벤트/레슨 개설</Btn>}
      {show("book_event")     && <Btn disabled={!allowed("book_event")}     onClick={onBook}>예약하기</Btn>}
      {show("manage_facility")&& <Btn disabled={!allowed("manage_facility")}onClick={onManage}>시설 관리</Btn>}
    </div>
  );
}