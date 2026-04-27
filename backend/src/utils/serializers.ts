export const withoutPassword = <T extends { password?: string }>(entity: T) => {
  const { password, ...safeEntity } = entity;
  return safeEntity;
};
