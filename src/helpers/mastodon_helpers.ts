/*
 * Functions for dealing with Mastodon API and data structures.
 */
import { mastodon } from "masto";
import { MediaCategory } from "fedialgo";

import { appLogger } from "./log_helpers";
import { mimeTypeExtension } from "./string_helpers";

export interface MastodonServer extends mastodon.v2.Instance {
    mimeExtensions: MimeExtensions;
};

// Map of server's allowed MIME types to file extensions
type MimeExtensions = Record<string, string[]>;

const MIME_GROUPS = Object.values(MediaCategory).reduce((acc, value) => {
    acc[value] = `${value}/*`;
    return acc;
}, {} as Record<MediaCategory, string>);


// Populate our mimeExtensions field in the mastodon.v2.Instance object based on the server's configuration.
// Turns Mastodon server configuration into what we need for DropZone to work with image attachments etc.
export function addMimeExtensionsToServer(server: mastodon.v2.Instance): MastodonServer {
    try {
        const mimeExtensions = buildMimeExtensions(server.configuration.mediaAttachments.supportedMimeTypes);
        return { ...server, mimeExtensions };
    } catch (error) {
        appLogger.error(`Failed to add MIME extensions to server: ${server.domain}`, error, `\nserver info:`, server);
        return { ...server, mimeExtensions: {} };
    }
};


// Build a map of MIME types to file extensions used by DropZone for image attachments etc.
function buildMimeExtensions (mimeTypes: string[]): MimeExtensions {
    const mimeExtensions = mimeTypes.reduce(
        (acc, mimeType) => {
            const [category, fileType] = mimeType.split('/');
            if (fileType.startsWith('x-') || fileType.includes('.')) return acc; // skip invalid file extensions

            if (category == MediaCategory.AUDIO) {
                acc[MIME_GROUPS[MediaCategory.AUDIO]] ||= [];
                acc[MIME_GROUPS[MediaCategory.AUDIO]].push(mimeTypeExtension(mimeType));
            } else if (category == MediaCategory.IMAGE) {
                acc[MIME_GROUPS[MediaCategory.IMAGE]] ||= [];
                acc[MIME_GROUPS[MediaCategory.IMAGE]].push(mimeTypeExtension(mimeType));

                if (fileType === 'jpeg') {
                    acc[MIME_GROUPS[MediaCategory.IMAGE]].push('.jpg'); // Add .jpg extension support
                }
            } else if (category == MediaCategory.VIDEO) {
                acc[MIME_GROUPS[MediaCategory.VIDEO]] ||= [];

                if (mimeType === 'video/quicktime') {
                    acc[MIME_GROUPS[MediaCategory.VIDEO]].push('.mov'); // Add .mov extension support
                } else {
                    acc[MIME_GROUPS[MediaCategory.VIDEO]].push(mimeTypeExtension(mimeType));
                }
            } else {
                appLogger.warn(`Unknown MIME type in home server's attachmentsConfig: ${mimeType}`);
            }

            return acc;
        },
        {} as MimeExtensions
    );

    appLogger.trace(`Server accepted MIME types:`, mimeExtensions);
    return mimeExtensions;
};
