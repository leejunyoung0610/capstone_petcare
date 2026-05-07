interface WireframeBoxProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  onClick?: () => void;
}

export function WireframeBox({ children, className = "", label, onClick }: WireframeBoxProps) {
  return (
    <div
      className={`border-2 border-dashed border-gray-400 bg-gray-50 p-4 rounded relative ${className}`}
      onClick={onClick}
      >
      {label && (
        <div className="absolute -top-3 left-2 bg-white px-2 text-xs text-gray-500 font-mono">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
