import {Container, Jumbotron} from "react-bootstrap";
import {Link} from "react-router-dom";


export default function () {
    return <div id={"Privacy"}>
        <h1>Himawari Privacy Policy</h1>
        <h2>What information do you collect?</h2>
        <p>
            When you access the Himawari servers, the server collects a record of your IP, the endpoint accessed,
            how much data you sent to the server, and when the access happened. This data is ephemeral and is erased
            as more logs come in over time and whenever the service is taken down for maintenance.
        </p>

        <p>
            When you create an account, you give us a username to identify your account with, a password,
            and your email address.
        </p>

        <p>
            As you use the service, we store the information you give us.
        </p>

        <h2>What is this information used for?</h2>
        <p>
            The access logs we collect are used for maintaining and monitoring service health.
        </p>

        <p>
            Your username and password are used to authenticate you when you use Himawari.
        </p>

        <p>
            Your email address is used to send transactional emails, such as user verification. We do not currently plan
            to use emails for promotional campaigns. Our email service provider is <a
            href={"https://www.mailjet.com"}>Mailjet</a>,
            and their privacy policy can be found <a href={"https://www.mailjet.com/security-privacy/"}>here</a>. We
            share your email
            address with them to deliver transactional emails as mentioned above.
        </p>
        <p>
            We will <i>never</i> sell the information you give us to third-parties.
        </p>
        <p>
            Any other information you submit while you use the service will be used to provide the service to you.
        </p>
        <h2>How is my information stored?</h2>
        <p>
            All information for the service, regardless of format, is stored in a database instance on our servers. We
            currently use <a href={"https://www.digitalocean.com/legal/privacy-policy/"}>DigitalOcean</a> for hosting.
        </p>
        <h2>Where should I look for changes in this policy?</h2>
        <p>
            If this policy changes, a notice will be pasted on the <Link to={"/"}>landing page</Link> for at least 30
            days. Once the email service is fully working, notices will be delivered via email as well.
        </p>
        <h2>How do you protect my data?</h2>
        <p>
            Your password is stored as a hash using the <a
            href={"https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id"}>
            Argon2id</a> algorithm with the settings recommended in the linked article.
        </p>

        <p>
            Access to the site is secured via SSL, and only the lead developer of the site has access to the production
            machine hosting the data.
        </p>

        <p>
            Himawari is not meant or certified to handle classified or other information subject to specific regulatory
            standards like HIPAA.
        </p>

        <p>
            In the event a data breach is detected, a notification will be posted to the <Link to={"/"}>landing
            page</Link>, and users will be notified by email as soon
            as is practicable.
        </p>
        <h2>Who should I contact for questions or to delete my account?</h2>
        <p>
            Please send an email to <a href={"mailto:me@nicksamson.com"}>the site dev</a> if you have questions about
            this policy or if you wish to delete your account.
        </p>
    </div>
}