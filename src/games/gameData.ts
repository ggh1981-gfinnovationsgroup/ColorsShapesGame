// Game Data - Extensive colors and shapes for educational games

export interface Color {
  name: string;
  nameEs: string;
  hex: string;
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Shape {
  name: string;
  nameEs: string;
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  emoji: string;
}

// EXTENSIVE COLOR COLLECTION - 30+ colors
export const COLORS: Color[] = [
  // Basic Colors (Easy)
  { name: 'Red', nameEs: 'Rojo', hex: '#e74c3c', id: 'red', difficulty: 'easy' },
  { name: 'Blue', nameEs: 'Azul', hex: '#3498db', id: 'blue', difficulty: 'easy' },
  { name: 'Green', nameEs: 'Verde', hex: '#2ecc71', id: 'green', difficulty: 'easy' },
  { name: 'Yellow', nameEs: 'Amarillo', hex: '#f1c40f', id: 'yellow', difficulty: 'easy' },
  { name: 'Orange', nameEs: 'Naranja', hex: '#e67e22', id: 'orange', difficulty: 'easy' },
  { name: 'Purple', nameEs: 'Morado', hex: '#9b59b6', id: 'purple', difficulty: 'easy' },
  { name: 'Pink', nameEs: 'Rosa', hex: '#e91e63', id: 'pink', difficulty: 'easy' },
  { name: 'Brown', nameEs: 'Café', hex: '#8d6e63', id: 'brown', difficulty: 'easy' },
  { name: 'Black', nameEs: 'Negro', hex: '#2c3e50', id: 'black', difficulty: 'easy' },
  { name: 'White', nameEs: 'Blanco', hex: '#ecf0f1', id: 'white', difficulty: 'easy' },

  // Intermediate Colors (Medium)
  { name: 'Turquoise', nameEs: 'Turquesa', hex: '#1abc9c', id: 'turquoise', difficulty: 'medium' },
  { name: 'Lime', nameEs: 'Lima', hex: '#27ae60', id: 'lime', difficulty: 'medium' },
  { name: 'Coral', nameEs: 'Coral', hex: '#ff6b6b', id: 'coral', difficulty: 'medium' },
  { name: 'Lavender', nameEs: 'Lavanda', hex: '#bb6bd9', id: 'lavender', difficulty: 'medium' },
  { name: 'Gold', nameEs: 'Dorado', hex: '#f39c12', id: 'gold', difficulty: 'medium' },
  { name: 'Silver', nameEs: 'Plateado', hex: '#95a5a6', id: 'silver', difficulty: 'medium' },
  { name: 'Cyan', nameEs: 'Cian', hex: '#74b9ff', id: 'cyan', difficulty: 'medium' },
  { name: 'Magenta', nameEs: 'Magenta', hex: '#fd79a8', id: 'magenta', difficulty: 'medium' },
  { name: 'Violet', nameEs: 'Violeta', hex: '#a29bfe', id: 'violet', difficulty: 'medium' },
  { name: 'Beige', nameEs: 'Beige', hex: '#ddd6c7', id: 'beige', difficulty: 'medium' },

  // Advanced Colors (Hard)
  { name: 'Crimson', nameEs: 'Carmesí', hex: '#dc143c', id: 'crimson', difficulty: 'hard' },
  { name: 'Emerald', nameEs: 'Esmeralda', hex: '#50c878', id: 'emerald', difficulty: 'hard' },
  { name: 'Sapphire', nameEs: 'Zafiro', hex: '#0f52ba', id: 'sapphire', difficulty: 'hard' },
  { name: 'Amber', nameEs: 'Ámbar', hex: '#ffbf00', id: 'amber', difficulty: 'hard' },
  { name: 'Indigo', nameEs: 'Índigo', hex: '#4b0082', id: 'indigo', difficulty: 'hard' },
  { name: 'Maroon', nameEs: 'Granate', hex: '#800000', id: 'maroon', difficulty: 'hard' },
  { name: 'Olive', nameEs: 'Oliva', hex: '#808000', id: 'olive', difficulty: 'hard' },
  { name: 'Navy', nameEs: 'Azul Marino', hex: '#000080', id: 'navy', difficulty: 'hard' },
  { name: 'Teal', nameEs: 'Verde Azulado', hex: '#008080', id: 'teal', difficulty: 'hard' },
  { name: 'Burgundy', nameEs: 'Borgoña', hex: '#800020', id: 'burgundy', difficulty: 'hard' },
  { name: 'Mint', nameEs: 'Menta', hex: '#98fb98', id: 'mint', difficulty: 'hard' },
  { name: 'Peach', nameEs: 'Durazno', hex: '#ffcba4', id: 'peach', difficulty: 'hard' },
  { name: 'Scarlet', nameEs: 'Escarlata', hex: '#ff2400', id: 'scarlet', difficulty: 'hard' },
  { name: 'Chartreuse', nameEs: 'Verde Limón', hex: '#7fff00', id: 'chartreuse', difficulty: 'hard' },
  { name: 'Aqua', nameEs: 'Agua', hex: '#00ffff', id: 'aqua', difficulty: 'hard' },
];

// EXTENSIVE SHAPE COLLECTION - 25+ shapes
export const SHAPES: Shape[] = [
  // Basic Shapes (Easy)
  { name: 'Circle', nameEs: 'Círculo', id: 'circle', difficulty: 'easy', emoji: '⭕' },
  { name: 'Square', nameEs: 'Cuadrado', id: 'square', difficulty: 'easy', emoji: '🟦' },
  { name: 'Triangle', nameEs: 'Triángulo', id: 'triangle', difficulty: 'easy', emoji: '🔺' },
  { name: 'Rectangle', nameEs: 'Rectángulo', id: 'rectangle', difficulty: 'easy', emoji: '▬' },
  { name: 'Star', nameEs: 'Estrella', id: 'star', difficulty: 'easy', emoji: '⭐' },
  { name: 'Heart', nameEs: 'Corazón', id: 'heart', difficulty: 'easy', emoji: '❤️' },

  // Intermediate Shapes (Medium)
  { name: 'Diamond', nameEs: 'Diamante', id: 'diamond', difficulty: 'medium', emoji: '💎' },
  { name: 'Oval', nameEs: 'Óvalo', id: 'oval', difficulty: 'medium', emoji: '🥚' },
  { name: 'Pentagon', nameEs: 'Pentágono', id: 'pentagon', difficulty: 'medium', emoji: '⬟' },
  { name: 'Hexagon', nameEs: 'Hexágono', id: 'hexagon', difficulty: 'medium', emoji: '⬡' },
  { name: 'Cross', nameEs: 'Cruz', id: 'cross', difficulty: 'medium', emoji: '➕' },
  { name: 'Arrow', nameEs: 'Flecha', id: 'arrow', difficulty: 'medium', emoji: '➡️' },
  { name: 'Moon', nameEs: 'Luna', id: 'moon', difficulty: 'medium', emoji: '🌙' },
  { name: 'Sun', nameEs: 'Sol', id: 'sun', difficulty: 'medium', emoji: '☀️' },

  // Advanced Shapes (Hard)
  { name: 'Octagon', nameEs: 'Octágono', id: 'octagon', difficulty: 'hard', emoji: '🛑' },
  { name: 'Rhombus', nameEs: 'Rombo', id: 'rhombus', difficulty: 'hard', emoji: '🔶' },
  { name: 'Trapezoid', nameEs: 'Trapecio', id: 'trapezoid', difficulty: 'hard', emoji: '🔸' },
  { name: 'Parallelogram', nameEs: 'Paralelogramo', id: 'parallelogram', difficulty: 'hard', emoji: '▱' },
  { name: 'Cylinder', nameEs: 'Cilindro', id: 'cylinder', difficulty: 'hard', emoji: '🪣' },
  { name: 'Cone', nameEs: 'Cono', id: 'cone', difficulty: 'hard', emoji: '🍦' },
  { name: 'Cube', nameEs: 'Cubo', id: 'cube', difficulty: 'hard', emoji: '🎲' },
  { name: 'Sphere', nameEs: 'Esfera', id: 'sphere', difficulty: 'hard', emoji: '🌐' },
  { name: 'Pyramid', nameEs: 'Pirámide', id: 'pyramid', difficulty: 'hard', emoji: '🔺' },
  { name: 'Lightning', nameEs: 'Rayo', id: 'lightning', difficulty: 'hard', emoji: '⚡' },
  { name: 'Flower', nameEs: 'Flor', id: 'flower', difficulty: 'hard', emoji: '🌸' },
  { name: 'Leaf', nameEs: 'Hoja', id: 'leaf', difficulty: 'hard', emoji: '🍃' },
  { name: 'Snowflake', nameEs: 'Copo de Nieve', id: 'snowflake', difficulty: 'hard', emoji: '❄️' },
];

// Helper functions to filter by difficulty
export const getColorsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): Color[] => {
  return COLORS.filter(color => color.difficulty === difficulty);
};

export const getShapesByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): Shape[] => {
  return SHAPES.filter(shape => shape.difficulty === difficulty);
};

// Get random items
export const getRandomColors = (count: number, difficulty?: 'easy' | 'medium' | 'hard'): Color[] => {
  const sourceColors = difficulty ? getColorsByDifficulty(difficulty) : COLORS;
  const shuffled = [...sourceColors].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, sourceColors.length));
};

export const getRandomShapes = (count: number, difficulty?: 'easy' | 'medium' | 'hard'): Shape[] => {
  const sourceShapes = difficulty ? getShapesByDifficulty(difficulty) : SHAPES;
  const shuffled = [...sourceShapes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, sourceShapes.length));
};
