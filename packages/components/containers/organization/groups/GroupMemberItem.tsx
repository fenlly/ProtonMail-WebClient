import { c } from 'ttag';

import Badge from '@proton/components/components/badge/Badge';
import type { Group, GroupMember } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';

import GroupMemberItemDropdown from './GroupMemberItemDropdown';
import { GroupMemberItemWrapper } from './components/GroupMemberItemWrapper';

type InvitationBadgeMap = Partial<{
    [key in GROUP_MEMBER_STATE]: { label: string; tooltip: string };
}>;

const getInvitationBadgeMap = (): InvitationBadgeMap => ({
    [GROUP_MEMBER_STATE.PENDING]: {
        label: c('invitation status').t`Pending`,
        tooltip: c('tooltip').t`Waiting for user to accept the invitation`,
    },
    [GROUP_MEMBER_STATE.REJECTED]: {
        label: c('invitation status').t`Declined`,
        tooltip: c('tooltip').t`User declined invitation`,
    },
    [GROUP_MEMBER_STATE.PAUSED]: {
        label: c('invitation status').t`Paused`,
        tooltip: c('tooltip').t`Group membership paused`,
    },
});

interface Props {
    groupMember: GroupMember;
    memberName?: string;
    group: Group; // needs to be removed once GroupMemberItemDropdown does not need it
    canOnlyDelete: boolean;
}

export const GroupMemberItem = ({
    groupMember,
    groupMember: { Email, State },
    memberName,
    group,
    canOnlyDelete,
}: Props) => {
    const badge = getInvitationBadgeMap()[State];

    return (
        <>
            <GroupMemberItemWrapper
                memberEmail={Email}
                memberName={memberName ?? Email}
                groupMemberType={groupMember.Type}
            >
                <div className="flex flex-row gap-2 flex-nowrap self-center">
                    {badge && (
                        <span>
                            <Badge type="origin" className="rounded-sm color-weak" tooltip={badge.tooltip}>
                                {badge.label}
                            </Badge>
                        </span>
                    )}
                </div>
                <div>
                    <GroupMemberItemDropdown member={groupMember} group={group} canOnlyDelete={canOnlyDelete} />
                </div>
            </GroupMemberItemWrapper>
        </>
    );
};
