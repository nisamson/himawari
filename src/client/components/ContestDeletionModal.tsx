import {PropsWithoutRef, useState} from "react";
import {Alert, Button, Modal, ModalProps} from "react-bootstrap";
import LoadingSpinner from "./LoadingSpinner";
import {Contest} from "../../model/contests";
import {toast} from "react-toastify";

type Args = {contestInfo: Contest.Info, onClose: (confirmed: boolean) => void, jwt: string};

export default function(props: Args & ModalProps) {
    let {contestInfo, onClose, jwt, ...other}: Args & ModalProps = props;
    let [submitting, setSubmitting] = useState(false);
    const onSubmit = async () => {
        setSubmitting(true);
        try {
            let res = await Contest.deleteContest(jwt, contestInfo.id);
            if (res.isErr()) {
                toast.error(res.error.longMessage());
                return;
            }
            toast.success(`Deleted contest: ${contestInfo.name}`);
            onClose(true);
        } finally {
            setSubmitting(false);
        }
    }

    return <Modal {...other} aria-labelledby={"contest-deletion-modal-title"} centered>
        <Modal.Header closeButton>
            <Modal.Title id={"contest-deletion-modal-title"}>
                Confirm Contest Deletion
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Alert variant={"danger"}>
                Are you sure you want to delete "{contestInfo.name}"?

                This action is irreversible.
            </Alert>
        </Modal.Body>
        <Modal.Footer>
            <Button variant={"danger"} disabled={submitting} onClick={onSubmit}>
                {submitting ? <LoadingSpinner/> : "Yes, delete it."}
            </Button>
            <Button variant={"outline-primary"} disabled={submitting} onClick={() => onClose(false)}>
                No, cancel.
            </Button>
        </Modal.Footer>
    </Modal>
}