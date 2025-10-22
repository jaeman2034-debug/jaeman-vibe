interface SpinnerProps {
  color?: string; // hex ?�는 tailwind ?�래??  size?: number;  // px ?�위
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
