
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/types";

interface TagBadgeProps {
  tag: Tag;
  onClick?: () => void;
  className?: string;
}

const TagBadge = ({ tag, onClick, className = "" }: TagBadgeProps) => {
  // Check if the color is a gradient (contains "gradient" or multiple colors with comma separator)
  const isGradient = tag.color?.includes('gradient') || tag.color?.includes(',');
  
  // Background style based on tag color
  const getBackgroundStyle = () => {
    if (!tag.color) return { backgroundColor: '#3b82f620' };
    
    if (isGradient) {
      // For gradients, use them directly
      if (tag.color.includes('gradient')) {
        return { background: tag.color };
      }
      
      // For comma-separated colors, create a linear gradient
      const colors = tag.color.split(',').map(c => c.trim());
      if (colors.length >= 2) {
        return { background: `linear-gradient(135deg, ${colors.join(', ')})` };
      }
    }
    
    // For single colors, use with transparency for background
    return { backgroundColor: `${tag.color}20` };
  };
  
  // Border style
  const getBorderStyle = () => {
    if (!tag.color) return { borderColor: '#3b82f6' };
    
    if (isGradient) {
      // For gradients, use the first color or a default
      if (tag.color.includes(',')) {
        return { borderColor: tag.color.split(',')[0].trim() };
      }
      return { borderColor: '#3b82f6' };
    }
    
    return { borderColor: tag.color };
  };
  
  // Text color style - make it white for gradients, or the tag color for solid colors
  const getTextStyle = () => {
    if (isGradient) {
      return { color: '#ffffff' };
    }
    
    return { color: tag.color }; // Use tag color for text
  };
  
  return (
    <Badge 
      key={tag.id} 
      variant="outline" 
      className={`cursor-pointer hover:bg-gray-700/50 transition-colors ${className}`}
      style={{ 
        ...getBackgroundStyle(),
        ...getBorderStyle(),
        ...getTextStyle(),
        maxWidth: '150px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      onClick={onClick}
      title={tag.name}
    >
      {tag.name}
    </Badge>
  );
};

export default TagBadge;
