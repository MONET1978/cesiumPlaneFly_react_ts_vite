/**
 * 生成唯一标识符
 */
export function generateId(): string {
    return crypto.randomUUID()
}
