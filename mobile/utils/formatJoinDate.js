export function formatJoinDate(dateString) {
  if (!dateString) return "";
  const joinDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - joinDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "เข้าร่วมวันนี้";
  if (diffDays === 1) return "เข้าร่วมเมื่อวาน";
  if (diffDays < 7) return `เข้าร่วม ${diffDays} วันที่แล้ว`;
  if (diffDays < 30)
    return `เข้าร่วม ${Math.floor(diffDays / 7)} สัปดาห์ที่แล้ว`;

  return joinDate.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
