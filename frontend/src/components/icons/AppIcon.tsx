import { IconType } from 'react-icons';

interface AppIconProps {
  icon: IconType;
  size?: number;
  className?: string;
}

export default function AppIcon({ icon: Icon, size = 20, className = '' }: AppIconProps) {
  return <Icon size={size} className={className} />;
}
