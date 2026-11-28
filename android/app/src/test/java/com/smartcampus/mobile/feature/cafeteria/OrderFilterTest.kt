package com.smartcampus.mobile.feature.cafeteria

import com.smartcampus.mobile.core.model.dto.CafeteriaOrderDto
import org.junit.Assert.assertEquals
import org.junit.Test

class OrderFilterTest {

    @Test
    fun cancelledOrdersStayInBackendButLeaveTheActiveList() {
        val orders = listOf(
            CafeteriaOrderDto(id = "1", status = "CONFIRMED"),
            CafeteriaOrderDto(id = "2", status = "CANCELLED"),
            CafeteriaOrderDto(id = "3", status = "cancelled"),
        )

        assertEquals(listOf("1"), orders.activeOnly().map { it.id })
    }
}
