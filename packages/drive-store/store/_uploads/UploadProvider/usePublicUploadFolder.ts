import { c } from 'ttag';

import { TransferCancel } from '../../../components/TransferManager/transfer';
import useQueuedFunction from '../../../hooks/util/useQueuedFunction';
import { isErrorDueToNameConflict } from '../../../utils/isErrorDueToNameConflict';
import { useLinkActions, useLinksActions } from '../../_links';
import type { UploadFolderControls } from '../interface';
import { TransferConflictStrategy } from '../interface';
import type { ConflictStrategyHandler } from './interface';
import usePublicUploadHelper from './usePublicUploadHelper';

type LogCallback = (message: string) => void;

interface Folder {
    isNewFolder: boolean;
    folderId: string;
    folderName: string;
}
// TODO: Add upload folder implementation
export default function usePublicUploadFolder() {
    const queuedFunction = useQueuedFunction();
    const { createFolder } = useLinkActions();
    const { deleteChildrenLinks } = useLinksActions();
    const { findAvailableName, getLinkByName } = usePublicUploadHelper();

    const createEmptyFolder = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentId: string,
        folderName: string,
        modificationTime?: Date
    ): Promise<Folder> => {
        const folderId = await createFolder(abortSignal, shareId, parentId, folderName, modificationTime);
        return {
            folderId,
            isNewFolder: true,
            folderName,
        };
    };

    const getFolder = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentId: string,
        folderName: string
    ): Promise<Folder> => {
        const link = await getLinkByName(abortSignal, shareId, parentId, folderName);
        if (!link) {
            throw Error(c('Error').t`The original folder not found`);
        }
        if (link.isFile) {
            throw Error(c('Error').t`File cannot be merged with folder`);
        }
        checkSignal(abortSignal, folderName);
        return {
            folderId: link.linkId,
            isNewFolder: false,
            folderName,
        };
    };

    const replaceDraft = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentId: string,
        linkId: string,
        folderName: string,
        modificationTime?: Date
    ) => {
        await deleteChildrenLinks(abortSignal, shareId, parentId, [linkId]);
        return createEmptyFolder(abortSignal, shareId, parentId, folderName, modificationTime);
    };

    const handleNameConflict = async (
        abortSignal: AbortSignal,
        {
            shareId,
            parentId,
            folderName,
            modificationTime,
            getFolderConflictStrategy,
            log,
        }: {
            shareId: string;
            parentId: string;
            folderName: string;
            modificationTime: Date | undefined;
            getFolderConflictStrategy: ConflictStrategyHandler;
            log: LogCallback;
        },
        { filename, draftLinkId }: { filename: string; draftLinkId?: string }
    ) => {
        log(`Name conflict`);
        const link = await getLinkByName(abortSignal, shareId, parentId, folderName);
        const originalIsFolder = link ? !link.isFile : false;

        checkSignal(abortSignal, folderName);
        const conflictStrategy = await getFolderConflictStrategy(abortSignal, !!draftLinkId, originalIsFolder);
        log(`Conflict resolved with: ${conflictStrategy}`);
        if (conflictStrategy === TransferConflictStrategy.Rename) {
            log(`Creating new folder`);
            return createEmptyFolder(abortSignal, shareId, parentId, filename, modificationTime);
        }
        if (conflictStrategy === TransferConflictStrategy.Replace) {
            if (draftLinkId) {
                log(`Replacing draft`);
                return replaceDraft(abortSignal, shareId, parentId, draftLinkId, folderName, modificationTime);
            }
            log(`Merging folders`);
            return getFolder(abortSignal, shareId, parentId, folderName);
        }
        if (conflictStrategy === TransferConflictStrategy.Skip) {
            throw new TransferCancel({ message: c('Info').t`Transfer skipped for folder "${folderName}"` });
        }
        throw new Error(`Unknown conflict strategy: ${conflictStrategy}`);
    };

    const prepareFolderOptimistically = (
        abortSignal: AbortSignal,
        shareId: string,
        parentId: string,
        folderName: string,
        modificationTime: Date | undefined,
        getFolderConflictStrategy: ConflictStrategyHandler,
        log: LogCallback
    ): Promise<Folder> => {
        const lowercaseName = folderName.toLowerCase();

        return queuedFunction(`upload_empty_folder:${lowercaseName}`, async () => {
            log(`Creating new folder`);
            return createEmptyFolder(abortSignal, shareId, parentId, folderName, modificationTime).catch(
                async (err) => {
                    if (isErrorDueToNameConflict(err)) {
                        const {
                            filename: newName,
                            draftLinkId,
                            clientUid,
                        } = await findAvailableName(abortSignal, {
                            shareId,
                            parentLinkId: parentId,
                            filename: folderName,
                        });
                        checkSignal(abortSignal, folderName);
                        // Automatically replace file - previous draft was uploaded
                        // by the same client.
                        if (draftLinkId && clientUid) {
                            log(`Automatically replacing draft`);
                            return replaceDraft(abortSignal, shareId, parentId, draftLinkId, newName, modificationTime);
                        }

                        return handleNameConflict(
                            abortSignal,
                            {
                                shareId,
                                parentId,
                                folderName,
                                modificationTime,
                                getFolderConflictStrategy,
                                log,
                            },
                            {
                                filename: newName,
                                draftLinkId,
                            }
                        );
                    }
                    throw err;
                }
            );
        })();
    };

    const initPublicFolderUpload = (
        shareId: string,
        parentId: string,
        folderName: string,
        modificationTime: Date | undefined,
        getFolderConflictStrategy: ConflictStrategyHandler,
        log: LogCallback
    ): UploadFolderControls => {
        const abortController = new AbortController();
        return {
            start: () => {
                return prepareFolderOptimistically(
                    abortController.signal,
                    shareId,
                    parentId,
                    folderName,
                    modificationTime,
                    getFolderConflictStrategy,
                    log
                );
            },
            cancel: () => {
                abortController.abort();
            },
        };
    };

    return {
        initPublicFolderUpload,
    };
}

function checkSignal(abortSignal: AbortSignal, name: string) {
    if (abortSignal.aborted) {
        throw new TransferCancel({ message: c('Info').t`Transfer canceled for folder "${name}"` });
    }
}
