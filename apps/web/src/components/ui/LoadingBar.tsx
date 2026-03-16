type LoadingBarProps = {
  isActive: boolean;
};

export function LoadingBar({ isActive }: LoadingBarProps) {
  if (!isActive) return null;
  return <div className="loading-bar" />;
}
