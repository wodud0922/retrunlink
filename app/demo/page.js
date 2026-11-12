import ReturnLinkApp from "../../components/ReturnLinkApp";

export const metadata = {
  title: "리턴링크 데모 | 손님 화면과 사장님 화면 둘러보기",
  description: "가입 없이 손님 접수 화면과 사장님 체크리스트를 직접 눌러 보세요.",
};

export default function Demo() {
  return <ReturnLinkApp initialView="customer" demo />;
}
