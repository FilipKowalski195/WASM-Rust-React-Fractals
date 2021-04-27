class RepeatedWorkerPool {


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

        if (this.onEachMessage != null) {
            this.onEachMessage(event)
        }
    }

    postMessage(data) {
        this.workers[this.next].postMessage(data)
        this.next = this.next >= this.workers.length ? 0 : this.next + 1;
    }


}

export default RepeatedWorkerPool;