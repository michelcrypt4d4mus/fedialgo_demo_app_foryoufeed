import { ModalProps as BootstrapModalProps } from 'react-bootstrap';

import type { mastodon } from 'masto';


export interface App extends mastodon.v1.Client {
    redirectUri?: string;
    [key: string]: unknown;
};


// TODO: where does this come from?
export type User = {
    access_token: string;
    id: string;
    profilePicture?: string;
    username: string;
    server: string;  // homeserver domain
};


export interface ModalProps extends BootstrapModalProps {
    dialogClassName?: "modal-sm" | "modal-lg" | "modal-xl" | "modal-fullscreen" | undefined,
    show: boolean,
    setShow: (show: boolean) => void,
    subtitle?: string | React.ReactNode,
    title: string,
};


// For rendering MultimediaNode component without a Toot
export type FakeToot = {
    audioAttachments: mastodon.v1.MediaAttachment[];
    imageAttachments: mastodon.v1.MediaAttachment[];
    mediaAttachments: mastodon.v1.MediaAttachment[];
    videoAttachments: mastodon.v1.MediaAttachment[];
    uri?: string;
};
