export enum CircuitBreakerStateEnum {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerOptions {
    failureThreshold: number;
    timeout: number;
    resetTimeout: number
}

export interface CircuitBreakerState {
    state: CircuitBreakerStateEnum, //status do circuit breaker
    failureCount: number, // Contador de falhas consecutivas, desde a ultima redefinição de sucesso
    lastFailureTime: number, // Timeout da ultima falha registrada
    nextAttemptTime: number // Tempo estimado para a próxima tentativa
}

export interface CircuitBreakerResult<T> {
    success: boolean,
    data?: T,
    error?: Error,
    fromCache?: boolean
}