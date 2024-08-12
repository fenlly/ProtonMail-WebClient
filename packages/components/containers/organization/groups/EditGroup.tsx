import { useEffect, useState } from 'react';

import { Form, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { Panel, PanelHeader } from '@proton/atoms/Panel';
import {
    InputFieldTwo,
    Option,
    SelectTwo,
    TextAreaTwo,
    useFormErrors,
    useModalState,
} from '@proton/components/components';
import { InputFieldStacked } from '@proton/components/components/inputFieldStacked';
import InputFieldStackedGroup from '@proton/components/components/inputFieldStacked/InputFieldStackedGroup';
import { useLoading } from '@proton/hooks';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { Group } from '@proton/shared/lib/interfaces';
import { GroupPermissions } from '@proton/shared/lib/interfaces';

import DiscardGroupChangesPrompt from './DiscardGroupChangesPrompt';
import GroupAddressDomainSelect from './GroupAddressDomainSelect';
import GroupMemberList from './GroupMemberList';
import { NewGroupMemberInput } from './NewGroupMemberInput';
import { NewGroupMemberItem } from './NewGroupMemberItem';
import { getAddressSuggestedLocalPart } from './helpers';
import type { GroupsManagementReturn } from './types';

interface Props {
    groupsManagement: GroupsManagementReturn;
    groupData: Group;
}

export interface NewGroupMember {
    Name: string;
    Address: string;
}

const EditGroup = ({ groupsManagement, groupData }: Props) => {
    const {
        uiState,
        setUiState,
        handleSaveGroup,
        form,
        groupMembers,
        loadingGroupMembers,
        groups,
        domainData,
        suggestedAddressDomainName,
        suggestedAddressDomainPart,
        selectedGroup,
    } = groupsManagement;

    const { resetForm, dirty, values: formValues, setFieldValue } = form;
    const { loadingCustomDomains, selectedDomain, setSelectedDomain, customDomains } = domainData;
    const { validator, onFormSubmit } = useFormErrors();
    const [discardChangesModalProps, setDiscardChangesModal, renderDiscardChangesModal] = useModalState();
    const [loading, withLoading] = useLoading();
    const [newGroupMembers, setNewGroupMembers] = useState<NewGroupMember[]>([]);

    const newEmailsToAdd = newGroupMembers.map((member) => member.Address);

    useEffect(() => {
        if (uiState === 'edit') {
            const addressWithoutDomain = formValues.address.substring(0, formValues.address.indexOf('@'));
            const addressDomain = formValues.address.substring(formValues.address.indexOf('@') + 1);
            setFieldValue('address', addressWithoutDomain);
            setSelectedDomain(addressDomain);
        } else if (uiState === 'new') {
            setSelectedDomain(suggestedAddressDomainPart);
        }
    }, [uiState]);

    const onDiscardChanges = () => {
        setUiState(groups.length === 0 ? 'empty' : 'view');
        resetForm({
            values: {
                name: groupData.Name,
                description: groupData.Description,
                address: groupData.Address.Email,
                permissions: groupData.Permissions ?? GroupPermissions.NobodyCanSend,
                members: '',
            },
        });
    };

    const handleAddNewMembers = (newMembers: NewGroupMember[]) => {
        setNewGroupMembers((prev) => [...prev, ...newMembers]);
    };

    const handleRemoveNewGroupMember = (memberToRemove: NewGroupMember) => {
        const updatedNewMembersList = newGroupMembers.filter((prev) => prev !== memberToRemove);
        setNewGroupMembers(updatedNewMembersList);
    };

    return (
        <>
            {renderDiscardChangesModal && (
                <DiscardGroupChangesPrompt onConfirm={onDiscardChanges} {...discardChangesModalProps} />
            )}
            <Panel
                header={
                    <PanelHeader
                        className="flex justify-space-between"
                        actions={(() => {
                            return [
                                <Button
                                    color="weak"
                                    onClick={() => {
                                        if (dirty) {
                                            setDiscardChangesModal(true);
                                        } else {
                                            onDiscardChanges();
                                        }
                                    }}
                                >
                                    {c('Action').t`Cancel`}
                                </Button>,
                                <Button
                                    color="norm"
                                    key="button-save"
                                    disabled={!dirty}
                                    loading={loading}
                                    onClick={() => {
                                        onFormSubmit();
                                        void withLoading(handleSaveGroup(newEmailsToAdd));
                                    }}
                                >
                                    {c('Action').t`Save`}
                                </Button>,
                            ];
                        })()}
                    />
                }
            >
                <FormikProvider value={form}>
                    <Form id="groups" className="flex flex-column gap-4">
                        <InputFieldStackedGroup>
                            <InputFieldStacked isGroupElement icon="user">
                                <InputFieldTwo
                                    label={c('Label').t`Group name`}
                                    type="text"
                                    unstyled
                                    inputClassName="rounded-none"
                                    name="name"
                                    maxLength={30}
                                    placeholder={c('placeholder').t`Add a group name`}
                                    autoFocus={uiState === 'new' ? true : undefined}
                                    value={formValues.name}
                                    onValue={(name: string) => {
                                        setFieldValue('name', name);
                                    }}
                                    onBlur={() => {
                                        if (formValues.name !== '' && formValues.address === '') {
                                            const suggestedLocalPart = getAddressSuggestedLocalPart(formValues.name);
                                            setFieldValue('address', suggestedLocalPart);
                                        }
                                    }}
                                    error={validator([requiredValidator(formValues.name)])}
                                />
                            </InputFieldStacked>
                            <InputFieldStacked isGroupElement icon="text-align-left">
                                <InputFieldTwo
                                    className="rounded-none p-0 resize-none"
                                    as={TextAreaTwo}
                                    label={c('Label').t`Purpose`}
                                    unstyled
                                    autoGrow
                                    name="description"
                                    placeholder={c('placeholder').t`e.g. distribution list for marketing team`}
                                    value={formValues.description}
                                    onValue={(description: string) => {
                                        setFieldValue('description', description);
                                    }}
                                />
                            </InputFieldStacked>
                        </InputFieldStackedGroup>
                        <InputFieldStackedGroup>
                            <InputFieldStacked isGroupElement icon="earth">
                                <InputFieldTwo
                                    label={c('Label').t`Group address`}
                                    unstyled
                                    className="rounded-none"
                                    name="address"
                                    placeholder={c('placeholder').t`e.g. marketing`}
                                    value={formValues.address}
                                    onValue={(address: string) => {
                                        setFieldValue('address', address);
                                    }}
                                    error={validator([emailValidator(`${formValues.address}@${selectedDomain}`)])}
                                    disabled={uiState === 'edit'} // disable until BE supports address change
                                    suffix={(() => {
                                        if (loadingCustomDomains) {
                                            return <CircleLoader />;
                                        }

                                        return (
                                            <GroupAddressDomainSelect
                                                domains={customDomains}
                                                selectedDomain={selectedDomain}
                                                suggestedDomainName={suggestedAddressDomainName}
                                                onChange={(value: string) => setSelectedDomain(value)}
                                                setSelectedDomain={setSelectedDomain}
                                                disabled={uiState === 'edit'} // disable until BE supports address change
                                            />
                                        );
                                    })()}
                                />
                            </InputFieldStacked>
                            <InputFieldStacked isGroupElement icon="lock">
                                <InputFieldTwo
                                    label={c('Label').t`Who can send to this group address?`}
                                    as={SelectTwo}
                                    unstyled
                                    className="rounded-none"
                                    name="permissions"
                                    placeholder={c('placeholder').t`Members`}
                                    value={formValues.permissions}
                                    onValue={(permissions: any) => {
                                        setFieldValue('permissions', permissions);
                                    }}
                                >
                                    <Option
                                        title={c('option').t`Nobody by default`}
                                        value={GroupPermissions.NobodyCanSend}
                                    />
                                    <Option
                                        title={c('option').t`Members`}
                                        value={GroupPermissions.GroupMembersCanSend}
                                    />
                                    <Option
                                        title={c('option').t`Organization members`}
                                        value={GroupPermissions.OrgMembersCanSend}
                                    />
                                    <Option
                                        title={c('option').t`Everyone, incl. outside`}
                                        value={GroupPermissions.EveryoneCanSend}
                                    />
                                </InputFieldTwo>
                            </InputFieldStacked>
                        </InputFieldStackedGroup>
                    </Form>
                </FormikProvider>
                <NewGroupMemberInput
                    newGroupMembers={newGroupMembers}
                    handleAddNewGroupMembers={handleAddNewMembers}
                    groupMembers={groupMembers}
                />
                <div className="mt-3 flex flex-column gap-3">
                    <div className="flex flex-column gap-3">
                        {newGroupMembers.reverse().map((member) => {
                            return (
                                <NewGroupMemberItem
                                    member={member}
                                    handleRemoveNewMember={handleRemoveNewGroupMember}
                                    submitting={loading}
                                />
                            );
                        })}
                    </div>
                    <GroupMemberList
                        groupMembers={groupMembers}
                        loading={loadingGroupMembers}
                        group={selectedGroup}
                        edit
                    />
                </div>
            </Panel>
        </>
    );
};

export default EditGroup;
