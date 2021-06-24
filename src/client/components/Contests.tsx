import {useQuery, useQueryClient} from "react-query";
import {AuthContext, AuthContextState, AuthState} from "./AuthContext";
import {Contest} from "../../model/contests";
import {Http, ValidationFailure} from "../../model";
import {FormEvent, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {Redirect} from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import {
    Button, CardDeck,
    CardGroup,
    Container,
    Form,
    FormControl,
    FormGroup,
    Modal,
    Pagination,
    Row,
    Table
} from "react-bootstrap";
import {Paginator, usePaginator} from "./Paginator";
import {$ContestInfo} from "../../model/gen";
import {useStateWithCallbackLazy} from "use-state-with-callback";
import ContestDeletionModal from "./ContestDeletionModal";
import ContestInfoCard from "./ContestInfoCard";

export function Contests(props: { state: AuthContextState }) {
    const contests = useQuery<Contest.Info[], Http.Error>(["contests", props.state.state?.jwt], ({queryKey}) => Contest.getForUserOrThrow(queryKey[1] as string));
    useEffect(() => {
        if (contests.isError) {
            toast.error(contests.error.longMessage());
        }
    }, [contests.isError, contests.error])

    if (!props.state.state) {
        return <Redirect to={"/login"}/>;
    }

    return <div className={"Contests"}>
        {contests.isLoading && <LoadingSpinner/>}
        <ContestListings state={props.state} listings={contests.data || []}/>
    </div>
}

function ListingTable(props: { asJudge: boolean, listings: Contest.Info[] }) {
    let paginator = usePaginator(props.listings.length, 5);
    let idx = paginator.page * 5 + 1;
    let pageListings = props.listings.slice(idx - 1, idx - 1 + 5);


    return <div className={"ListingTable"}>
        {
            pageListings.map((val, index) => {
                return <div className={"mb-2"}><ContestInfoCard info={val} asJudge={props.asJudge}/></div>
            })
        }
        <Paginator onPageChange={paginator.setPage} paginator={paginator}/>
    </div>
}

function ContestListings(props: { state: AuthContextState, listings: Contest.Info[] }) {
    let state = props.state.state!;
    let listings = props.listings;
    let userListings = listings.filter((v) => v.owner === state.info.username);
    let judgeListings = listings.filter((v) => v.owner !== state.info.username);
    const [showCreate, setShowCreate] = useState(false);
    const [isSubmitting, setSubmitting] = useStateWithCallbackLazy(false);
    const [newContestName, setContestName] = useState("");
    let client = useQueryClient();
    const isValid = newContestName.length >= 1 && newContestName.length <= $ContestInfo.properties.name.maxLength;

    const handleClose = () => setShowCreate(false);

    function startSubmit() {
        return new Promise((res) => {
            setSubmitting(true, () => res(undefined))
        });
    }

    const handleSubmit = async () => {
        await startSubmit();
        try {
            let contest = new Contest.New(newContestName);
            let res = await contest.create(state.jwt);
            if (res.isErr()) {
                toast.error(res.error.longMessage());
                return;
            }
            toast.success(`Successfully created contest: ${res.value.name.substr(0, 128)}${res.value.name.length > 128 ? "..." : ""}`);
            await client.invalidateQueries("contests");
            setContestName("");
            handleClose();
        } catch (e) {
            if (e instanceof ValidationFailure) {
                toast.error(e);
            }
        } finally {
            setSubmitting(false, () => undefined);
        }
    };

    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await handleSubmit();
    }

    return <>
        <div className={"Listings"}>
            <h1>Contests</h1>
            <Container className={"UserListings"}>
                <h2 className={"text-center text-md-left"}>
                    My Contests
                </h2>
                {userListings.length > 0 ? <ListingTable asJudge={false} listings={userListings}/> :
                    <div className={"NoContest text-muted text-center"}>No contests yet!</div>}
                <Button variant={"primary"} onClick={() => setShowCreate(true)} block className={"mt-1"}>
                    Create New Contest
                </Button>
            </Container>

            <hr/>
            <Container className={"JudgeListings"}>
                <h2 className={"text-center text-md-left"}>
                    Judge Contests
                </h2>
                {judgeListings.length > 0 ? <ListingTable asJudge={true} listings={judgeListings}/> :
                    <div className={"NoContest text-muted text-center"}>No contests yet!</div>}
            </Container>
        </div>
        <Modal backdrop={"static"} show={showCreate} size={"lg"} onHide={handleClose}
               aria-labelledby="contest-creation-modal-title" centered>
            <Modal.Header closeButton>
                <Modal.Title id={"contest-creation-modal-title"}>
                    Create New Contest
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleFormSubmit}>
                    <Form.Group controlId={"name"}>
                        <Form.Label>Contest Name</Form.Label>
                        <Form.Control type={"text"} placeholder={"Enter name"} isValid={isValid} value={newContestName}
                                      onChange={(e) => setContestName(e.target.value)}/>
                        <Form.Text className={"text-muted"}>
                            Must be between 1 and {$ContestInfo.properties.name.maxLength}.
                        </Form.Text>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant={"success"} onClick={handleSubmit} disabled={isSubmitting || !isValid}>
                    {isSubmitting ? <LoadingSpinner/> : "Submit"}
                </Button>
            </Modal.Footer>
        </Modal>
    </>
}