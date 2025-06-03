import { ModalProps as BootstrapModalProps } from 'react-bootstrap';
import { useState } from 'react';

import type { mastodon } from 'masto';

export type BooleanState = ReturnType<typeof useState<boolean>>;
export type ErrorHandler = (msg: string, errorObj?: Error, note?: string) => void;
export type MimeExtensions = Record<string, string[]>;


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
    title?: string,
};
