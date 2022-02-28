export interface MetaDataType {
    subject: string;
    emails: string[];
    headerImage?: string;

    title: string;
    icon: string;

    channels: string[];
    atChannel: boolean;
    atHere: boolean;
    userToken: string;

    numbers: string[];
    groups: string[];

    _: boolean;

    header: string;
    id: string;

    area: string;
    text: string;
    time: string;
}

export interface Status {
    error: boolean;
    key: string;
    message?: string | null;
}

export interface Plugin<T> {
    sendMessage(message: string, config: T): Promise<Status[]>;
    check(config: any): Promise<boolean>;
}

export interface PluginSetup<T> {
    // Separate schema and notifier
    init(): Plugin<T>;
    schema(): string;
}