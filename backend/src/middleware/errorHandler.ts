import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  // Error de Prisma - violación de restricción única
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflicto de unicidad',
      message: 'Ya existe un registro con estos valores únicos',
      details: err.meta
    });
  }

  // Error de Prisma - registro no encontrado
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'No encontrado',
      message: 'El registro solicitado no existe'
    });
  }

  // Error de Prisma - violación de clave foránea
  if (err.code === 'P2003') {
    return res.status(400).json({
      error: 'Referencia inválida',
      message: 'La referencia a otro registro no es válida',
      details: err.meta
    });
  }

  // Error de validación personalizado
  if (err.message) {
    return res.status(400).json({
      error: 'Error de validación',
      message: err.message
    });
  }

  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    message: 'Ocurrió un error inesperado'
  });
}
