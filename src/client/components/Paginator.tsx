import {Button, Form, FormControl, Pagination} from "react-bootstrap";
import {FormEvent, useState} from "react";
import {toast} from "react-toastify";

export interface PaginatorState {
    readonly page: number,
    readonly gotoForm: string,
    readonly setPage: (val: number) => void,
    readonly setGoto: (val: string) => void,
    readonly totalPages: number,
    readonly lastPage: number
}

export function usePaginator(cnt: number, perPage: number): PaginatorState {
    const [page, setPage] = useState(0);
    const [gotoForm, setGoto] = useState("1");
    let totalPages = cnt / perPage;
    totalPages = Math.max(Math.ceil(totalPages), 1);
    let lastPage = totalPages - 1;
    return {
        page, setPage, gotoForm, setGoto, totalPages, lastPage
    };
}

export function Paginator(props: {paginator: PaginatorState, onPageChange: (page: number) => void}) {
    let pag = props.paginator;
    function handlePageChange(e: FormEvent) {
        e.preventDefault();
        if (!pag.gotoForm) {
            toast.error("Please specify a page.");
            return;
        }
        let val = parseInt(pag.gotoForm);
        if (isNaN(val) || val < 1 || val > pag.totalPages) {
            toast.error(`Invalid page: ${pag.gotoForm}`);
            return;
        }
        props.onPageChange(val - 1);
    }
    return <div className={"d-flex align-items-baseline justify-content-between text-nowrap"}>
        <Pagination size={"sm"}>
            <Pagination.First onClick={() => pag.setPage(0)}/>
            <Pagination.Prev disabled={pag.page === 0} onClick={() => pag.setPage(pag.page - 1)}/>
            {pag.page > 1 && <Pagination.Item onClick={() => pag.setPage(pag.page - 1)}>{pag.page - 1}</Pagination.Item>}
            {pag.page > 0 && <Pagination.Item onClick={() => pag.setPage(pag.page)}>{pag.page}</Pagination.Item>}
            <Pagination.Item active>{pag.page + 1} / {pag.totalPages}</Pagination.Item>
            {pag.page < pag.totalPages - 1 &&
            <Pagination.Item onClick={() => pag.setPage(pag.page + 1)}>{pag.page + 2}</Pagination.Item>}
            {pag.page < pag.totalPages - 2 &&
            <Pagination.Item onClick={() => pag.setPage(pag.page + 2)}>{pag.page + 3}</Pagination.Item>}
            <Pagination.Next disabled={pag.page === pag.lastPage} onClick={() => pag.setPage(pag.page + 1)}/>
            <Pagination.Last onClick={() => pag.setPage(pag.lastPage)}/>
        </Pagination>
        <Form className={"d-inline-flex"} onSubmit={handlePageChange}>
            <FormControl size={"sm"} type={"number"} placeholder={"Go To"} onChange={(e) => pag.setGoto(e.target.value)} value={pag.gotoForm} className={"mr-sm-2"}/>
            <Button size={"sm"} type={"submit"} variant={"outline-primary"} className={"text-nowrap"}>Go To Page</Button>
        </Form>
    </div>
}