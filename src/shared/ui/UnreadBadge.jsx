const UnreadBadge = ({ count }) => {
  if (!count || count === 0) return null
  return (
    <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#FF6500] rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default UnreadBadge
