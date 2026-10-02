/** Cancel/ignore stale results whenever a signed-in user or session changes. */
export class AccountScope {
    private epoch = 0;
    private userId: string | null = null;
    private controllers = new Set<AbortController>();

    change(userId: string | null) {
        this.epoch++;
        this.userId = userId;
        for (const controller of this.controllers) controller.abort();
        this.controllers.clear();
    }

    request() {
        if (!this.userId) throw new Error('Se necesita una cuenta autenticada.');
        const epoch = this.epoch;
        const userId = this.userId;
        const controller = new AbortController();
        this.controllers.add(controller);
        return {
            userId,
            signal: controller.signal,
            isCurrent: () => epoch === this.epoch && userId === this.userId && !controller.signal.aborted,
            finish: () => this.controllers.delete(controller),
        };
    }
}
