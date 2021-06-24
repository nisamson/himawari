import {Contest} from "../../model/contests";
import {Button, Card} from "react-bootstrap";
import ContestDeletionModal from "./ContestDeletionModal";
import {AuthContext} from "./AuthContext";
import {useState} from "react";
import {useQueryClient} from "react-query";


export default function (props: { info: Contest.Info, asJudge: boolean }) {
    let info = props.info;
    const [showModal, setShow] = useState(false);
    let qc = useQueryClient();
    const onClose = async (confirmed: boolean) => {
        setShow(false);

        if (confirmed) {
            await qc.invalidateQueries("contests");
        }
    };

    return <div className={"ContestCard"}>
        <Card key={info.id} className={"ContestCard"}>
            <Card.Body>
                <Card.Title>{info.name}</Card.Title>
                <Card.Text className={"text-muted"}>
                    <span>Created {props.asJudge && <>by {info.owner}</>} on {info.created.toLocaleDateString()}</span>
                </Card.Text>

            </Card.Body>
            <Card.Footer>
                {props.asJudge ? <></> : <Button variant={"outline-danger"} onClick={() => setShow(true)}>Delete</Button>}
            </Card.Footer>
        </Card>
        <AuthContext.Consumer>
            {state =>
                <ContestDeletionModal show={showModal}
                                      contestInfo={info}
                                      onHide={() => setShow(false)}
                                      jwt={state.state!.jwt}
                                      onClose={onClose}

                />
            }
        </AuthContext.Consumer>
    </div>
}