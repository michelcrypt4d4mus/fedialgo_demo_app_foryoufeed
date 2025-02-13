import type { mastodon } from 'masto';


export interface CountsType {
    [key: string]: number;
};

export interface App extends mastodon.v1.Client {
    redirectUri: string;
    [key: string]: unknown;
};

export type User = {
    access_token: string;
    id: string;
    profilePicture?: string;
    username: string;
    server: string;
};
