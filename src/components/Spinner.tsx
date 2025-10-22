interface SpinnerProps {
  color?: string; // hex ?ëŠ” tailwind ?´ë˜??  size?: number;  // px ?¨ìœ„
}

export default function Spinner({ color = "#3B82F6", size = 32 }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center">
      <div
        style={{
          width: size,
          height: size,
          borderWidth: size / 8,
          borderColor: color,
          borderTopColor: "transparent",
        }}
        className="rounded-full animate-spin"
      />
    </div>
  );
}
