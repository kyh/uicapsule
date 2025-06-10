const Page = () => {
  return (
    <div className="flex flex-col gap-10 p-8 md:p-20">
      <h1 className="text-3xl leading-snug lg:text-5xl">Returns Policy</h1>
      <div className="flex flex-col gap-5 text-base leading-loose">
        <p>
          {`Thank you for shopping at [Your E-commerce Website Name]. We
            appreciate your business and want you to be completely satisfied with
            your purchase. If you are not entirely satisfied with your purchase,
            we're here to help.`}
        </p>

        <p>
          <strong>Returns</strong>
        </p>
        <p>
          You have [X days] to return an item from the date you received it. To
          be eligible for a return, your item must be unused and in the same
          condition that you received it. Your item must be in the original
          packaging.
        </p>
        <p>Your item needs to have the receipt or proof of purchase.</p>

        <p>
          <strong>Refunds</strong>
        </p>
        <p>
          Once we receive your item, we will inspect it and notify you that we
          have received your returned item. We will immediately notify you on
          the status of your refund after inspecting the item.
        </p>
        <p>
          {`If your return is approved, we will initiate a refund to your credit
        card (or original method of payment). You will receive the credit
        within a certain amount of days, depending on your card issuer's
        policies.`}
        </p>

        <p>
          <strong>Shipping</strong>
        </p>
        <p>
          You will be responsible for paying for your own shipping costs for
          returning your item. Shipping costs are non­refundable.
        </p>

        <p>
          <strong>Contact Us</strong>
        </p>
        <p>
          If you have any questions on how to return your item to us, contact us
          at [Your Contact Information].
        </p>

        <p>
          <strong>Exchange</strong>
        </p>
        <p>
          If you would like to exchange an item for a different one, please
          return the original item and place a new order. You will be refunded
          for the original item in accordance with our refund policy above.
        </p>
        <p>
          Please note that it takes us some time to process your return once we
          have received it. However, we will do our best to process it as
          quickly as possible. If you have any questions or concerns about our
          Returns Policy, please do not hesitate to contact us.
        </p>
        <p>
          [Your E-commerce Website Name] [Your Address] [City, State, Zip Code]
          [Email Address] [Phone Number]
        </p>
      </div>
    </div>
  );
};

export default Page;
