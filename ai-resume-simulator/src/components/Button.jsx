function Button({
  children,
  type = "button",
  onClick,
  variant = "primary",
}) {

const styles = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700",

  secondary:
    "bg-secondary-100 text-secondary-700 hover:bg-secondary-200",
}

  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-lg px-4 py-3 font-semibold ${styles[variant]}`}
    >
      {children}
    </button>
  )
}

export default Button