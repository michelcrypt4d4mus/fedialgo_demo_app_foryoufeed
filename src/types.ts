import { ModalProps as BootstrapModalProps } from 'react-bootstrap';
import { useState } from 'react';

import type { mastodon } from 'masto';

export type BooleanState = ReactState<boolean>;
export type ErrorHandler = (msg: string, errorObj?: Error, note?: string) => void;
export type MimeExtensions = Record<string, string[]>;
export type ReactState<T> = ReturnType<typeof useState<T>>;


// App and User are vestiges of the original pkreissel implementation
export interface App extends mastodon.v1.Client {
    redirectUri?: string;
    [key: string]: unknown;
};


export type User = {
    access_token: string;
    id: string;
    profilePicture?: string;
    username: string;
    server: string;  // homeserver domain
};


// New types below here
export interface ModalProps extends BootstrapModalProps {
    dialogClassName?: "modal-sm" | "modal-lg" | "modal-xl" | "modal-fullscreen" | undefined,
    show: boolean,
    setShow: (show: boolean) => void,
    subtitle?: string | React.ReactNode,
    title?: string,
};
