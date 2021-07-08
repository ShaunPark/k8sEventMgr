import * as k8s from "@kubernetes/client-node"
import { CoreV1Event } from "@kubernetes/client-node";
import { parse } from "ts-command-line-args"

class EventMgr {
    // K8S client instance
    private cli: k8s.CoreV1Api;

    constructor() {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        this.cli = kc.makeApiClient(k8s.CoreV1Api);
    }

    async run(namespace:string, body:CoreV1Event, nodename:string) {
        try {
            const node = await this.cli.readNode(nodename,undefined,undefined)
            body.involvedObject = {kind: "Node", name: nodename, uid: node.body.metadata?.uid};
            const result = await this.cli.createNamespacedEvent(namespace, body, undefined, undefined, undefined, undefined)
            } catch(err) {
                console.error(err)
            }
    }
}

interface Args {
    namespace: string;
    node: string;
    message: string;
    reason: string;
    help?:boolean
}

const file = process.argv[1].split("/")

// 명령줄 arguments 파싱
const { namespace, reason, message, node } = parse<Args>(
    {
        namespace: { type: String, alias: 'n' },
        node: { type: String, alias: 'd' , description: "'True' and 'False' are valid for status"},
        message: { type: String, alias: 'm',  description: "(Optional) Message of status"},
        reason: { type: String, alias: 'r',  description: "(Optional) Message of status"},
        help: { type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide' },
    }, 
    {
        helpArg: 'help',
        headerContentSections: [{ header: 'Change node condition', content:
         `ts-node ${file[file.length-1]} -n <nodename> -s <status> -t <condition> -m <message>` }],
    }   
)

// 실행 전 argument 검증 및 실행

const event:CoreV1Event = new CoreV1Event();
event.message = message;
event.reason = reason;
new EventMgr().run(namespace, event, node)
