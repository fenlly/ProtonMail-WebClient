import React, { useEffect, useState, useContext } from 'react';
import { c } from 'ttag';
import { SubTitle, Block, Label, Table, PrimaryButton, Select, TableHeader, TableRow, useModal, TableBody, useLoading } from 'react-components';
import { connect } from 'react-redux';
import { fetchMembers } from 'proton-shared/lib/state/members/actions';
import { queryAddresses } from 'proton-shared/lib/api/members';
import ContextApi from 'proton-shared/lib/context/api';

import AddressModal from './AddressModal';
import AddressActions from './AddressActions';
import AddressStatus from './AddressStatus';

const AddressesSection = ({ addresses, members, fetchMembers }) => {
    const { api } = useContext(ContextApi);
    const [selectedAddresses, setAddresses] = useState(addresses.data);
    const [member, setMember] = useState(members.find(({ Self }) => Self));
    const { loading, loaded, load } = useLoading(addresses.loading);
    const { isOpen: showAddressModal, open: openAddressModal, close: closeAddressModal } = useModal();
    const membersOptions = members.data.map(({ ID: value, Name: text, Self: self }) => ({ text, value, self }));

    const handleChangeMember = async ({ target }) => {
        const { value, self } = target;

        setMember(members.find(({ ID }) => (value === ID)));

        if (self) {
            return setAddresses(addresses.data);
        }

        load();
        const { Addresses } = await api(queryAddresses(value));
        setAddresses(Addresses);
        loaded();
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    return (
        <>
            <SubTitle>{c('Title').t`Addresses`}</SubTitle>
            <Block>
                <Label htmlFor="memberSelect" className="mr1">{c('Label').t`User:`}</Label>
                <Select id="memberSelect" value={member.ID} options={membersOptions} className="mr1" onChange={handleChangeMember} />
                <PrimaryButton onClick={openAddressModal}>{c('Action').t`Add address`}</PrimaryButton>
                <AddressModal show={showAddressModal} onClose={closeAddressModal} member={member} />
            </Block>
            <Table>
                <TableHeader cells={[
                    c('Header for addresses table').t`Address`,
                    c('Header for addresses table').t`Status`,
                    c('Header for addresses table').t`Actions`
                ]} />
                <TableBody loading={loading}>
                    {selectedAddresses.map((address, index) => {
                        const key = address.ID;
                        return <TableRow key={key} cells={[
                            address.Email,
                            <AddressStatus key={key} address={address} index={index} />,
                            <AddressActions key={key} address={address} index={index} />
                        ]} />;
                    })}
                </TableBody>
            </Table>
        </>
    );
};

const mapStateToProps = ({ addresses, members }) => ({ addresses, members });

const mapDispatchToProps = { fetchMembers };

export default connect(mapStateToProps, mapDispatchToProps)(AddressesSection);