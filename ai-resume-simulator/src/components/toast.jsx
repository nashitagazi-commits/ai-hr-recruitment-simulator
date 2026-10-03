function Toast({ message, type = "success" }) {

  const styles = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  }

  return (
    <div
      className={`fixed right-5 top-5 rounded-lg px-5 py-3 text-white shadow-lg ${styles[type]}`}
    >
      {message}
    </div>
  )
}

export default Toast