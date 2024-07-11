export default function calculateMaxPages(totalNumber: number, pageSize: number) {
  if (totalNumber <= 0 || pageSize <= 0) {
    return 0;
  }

  return Math.ceil(totalNumber / pageSize);
}
