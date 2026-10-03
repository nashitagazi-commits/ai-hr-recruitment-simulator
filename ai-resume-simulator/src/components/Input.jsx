function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}

export default Input