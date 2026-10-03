function Modal({ isOpen, onClose, title, children }) {

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">

      <div className="w-full max-w-md rounded-xl bg-white p-6">

        <div className="flex items-center justify-between">

          <h2 className="text-xl font-bold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>

        </div>

        <div className="mt-4">
          {children}
        </div>

      </div>

    </div>
  )
}

export default Modal