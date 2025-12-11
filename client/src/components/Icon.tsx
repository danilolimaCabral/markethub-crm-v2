import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: keyof typeof LucideIcons;
  size?: number;
  className?: string;
  color?: string;
}

/**
 * Componente Icon - Wrapper para ícones Lucide React
 * 
 * Garante que os ícones sejam renderizados corretamente em produção
 * com fallback caso o ícone não seja encontrado.
 */
export const Icon: React.FC<IconProps> = ({ name, size = 20, className = '', color }) => {
  const IconComponent = LucideIcons[name] as React.ComponentType<LucideIcons.LucideProps>;
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in lucide-react`);
    // Fallback para um ícone genérico
    const FallbackIcon = LucideIcons.Circle;
    return <FallbackIcon size={size} className={className} color={color} />;
  }
  
  return <IconComponent size={size} className={className} color={color} />;
};

export default Icon;
