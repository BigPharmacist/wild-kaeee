export default function BusinessCardScanInput({
  inputRef,
  onScan,
}) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      onChange={onScan}
      className="hidden"
    />
  )
}
