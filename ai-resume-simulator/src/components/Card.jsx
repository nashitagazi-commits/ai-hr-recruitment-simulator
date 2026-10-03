function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl bg-white p-6 shadow-lg ${className}`}
    >
      {children}
    </div>
  )
}

export default Card