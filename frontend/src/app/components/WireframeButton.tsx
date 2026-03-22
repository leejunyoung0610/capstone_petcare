interface WireframeButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export function WireframeButton({
  children,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  disabled = false,
}: WireframeButtonProps) {
  const baseStyle = "px-6 py-2 border-2 font-mono text-sm";
  const variantStyles = {
    primary: "border-blue-500 bg-blue-100 text-blue-700",
    secondary: "border-gray-500 bg-gray-100 text-gray-700",
    outline: "border-gray-400 bg-white text-gray-700"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseStyle} ${variantStyles[variant]} ${className} disabled:opacity-50`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
