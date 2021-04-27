class RepeatedWorkerPool {

    todo = 0

    constructor(workerSupplier, count) {
        this.workers = []
        this.next = 0
        this.onEachMessage = null;

        for (let i = 0; i < count; i++) {
            const worker = workerSupplier();
            worker.onmessage = (e) => this.onMessageHelper(e);
            this.workers.push(worker);
        }
    }

    onMessageHelper(event) {
        this.todo--;
        if (this.onEachMessage != null) {
            this.onEachMessage(event)
        }
    }

    postMessage(data) {
        this.todo++;
        this.workers[this.next].postMessage(data)
        this.next = this.next >= this.workers.length - 1 ? 0 : this.next + 1;
    }

    isOccupied() {
        return this.todo !== 0;
    }

}

export default RepeatedWorkerPool;