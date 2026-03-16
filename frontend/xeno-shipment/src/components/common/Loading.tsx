import { Spinner } from '@heroui/react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const Loading = ({ size = 'md', label = 'Loading...', className }: LoadingProps) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <Spinner size={size} color="primary" />
      {label && <p className="text-foreground-500">{label}</p>}
    </div>
  );
};

export default Loading;
