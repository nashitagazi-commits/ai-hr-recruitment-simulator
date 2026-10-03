function Badge({ children, variant = "blue" }) {

  const styles = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  )
}

export default Badge