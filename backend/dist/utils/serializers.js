export const withoutPassword = (entity) => {
    const { password, ...safeEntity } = entity;
    return safeEntity;
};
