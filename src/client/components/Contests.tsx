import {useQuery} from "react-query";
import {AuthContextState, AuthState} from "./AuthContext";
import {Contest} from "../../model/contests";
import {Http} from "../../model";
import {FormEvent, useEffect, useState} from "react";
import {toast} from "react-toastify";
import {Redirect} from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import {Button, Container, Form, FormControl, FormGroup, Pagination, Row, Table} from "react-bootstrap";
import {Paginator, usePaginator} from "./Paginator";

export function Contests(props: { state: AuthContextState }) {
    const contests = useQuery<Contest.Info[], Http.Error>(["contests", props.state.state?.jwt], ({queryKey}) => Contest.getForUserOrThrow(queryKey[1] as string));
    useEffect(() => {
        if (contests.isError) {
            toast.error(contests.error.longMessage());
        }
    }, [contests.isError])

    if (!props.state.state) {
        return <Redirect to={"/login"}/>;
    }

    return <div className={"Contests"}>
        {contests.isLoading && <LoadingSpinner/>}
        <ContestListings state={props.state} listings={contests.data || []}/>
    </div>
}

function ListingTable(props: { asJudge: boolean, listings: Contest.Info[] }) {
    let paginator = usePaginator(props.listings.length, 10);
    let idx = paginator.page * 10 + 1;
    let pageListings = props.listings.slice(idx - 1, idx - 1 + 10);

    return <div className={"ListingTable"}>
        <Table striped bordered hover>
            <thead>
            <tr>
                <th>#</th>
                <th>Name</th>
                {props.asJudge && <th>Creator</th>}
                <th>Created</th>
            </tr>
            </thead>
            <tbody>
            {
                pageListings.map((val, index) => {
                    return <tr key={val.id}>
                        <td>{idx + index}</td>
                        <td>{val.name}</td>
                        {props.asJudge && <td>{val.owner}</td>}
                        <td>{val.created.toLocaleDateString()}</td>
                    </tr>
                })
            }
            </tbody>
        </Table>
        <Paginator onPageChange={paginator.setPage} paginator={paginator}/>
    </div>
}

function ContestListings(props: { state: AuthContextState, listings: Contest.Info[] }) {
    let state = props.state.state!;
    let listings = props.listings;
    let userListings = listings.filter((v) => v.owner === state.info.username);
    let judgeListings = listings.filter((v) => v.owner !== state.info.username);
    return <div className={"Listings"}>
        <h1>Contests</h1>
        <Container className={"UserListings"}>
            <h2 className={"text-center text-md-left"}>
                My Contests
            </h2>
            {userListings.length > 0 ? <ListingTable asJudge={false} listings={userListings}/> : <div className={"NoContest text-muted text-center"}>No contests yet!</div>}
        </Container>
        <hr/>
        <Container className={"JudgeListings"}>
            <h2 className={"text-center text-md-left"}>
                Judge Contests
            </h2>
            {judgeListings.length > 0 ? <ListingTable asJudge={true} listings={judgeListings}/> : <div className={"NoContest text-muted text-center"}>No contests yet!</div>}

        </Container>
    </div>
}